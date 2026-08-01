import base64
import threading
import time
from typing import Dict, Optional, Tuple

import cv2
import numpy as np
from PIL import Image, ImageTk
from ultralytics import YOLO
import tkinter as tk
from tkinter import ttk, messagebox

import pymysql
from pymysql.cursors import DictCursor

# =========================
# CONFIG
# =========================
DB_CONFIG = {
    "host": "srv1113.hstgr.io",
    "user": "u858168866_userlogs",
    "password": "mQ#7Oz7qQVVa",
    "database": "u858168866_logs",
    "charset": "utf8mb4",
    "cursorclass": DictCursor,
    "autocommit": True,
}
TABLE_NAME = "trash_upload"

BATCH_LIMIT = 1           # GUI is clearer with 1 at a time
SLEEP_SECONDS = 2         # polling delay
CONF_THRESHOLD = 0.25
IMG_SIZE = 640
YOLO_MODEL_PATH = "yolov8n.pt"   # change to your weights path

cnn_classname=None

# Final status buckets
REUSABLE = {
    "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
    "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
    "tennis racket", "potted plant", "clock", "teddy bear", "toothbrush"
}
RECYCLABLE = {
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "microwave", "oven",
    "toaster", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "hair drier", "book"
}
NON_RECYCLABLE = {
    "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza",
    "donut", "cake", "vase"
}
CLASS_TO_STATUS: Dict[str, str] = {**{c: "Reusable" for c in REUSABLE},
                                   **{c: "Recyclable" for c in RECYCLABLE},
                                   **{c: "Non-Recyclable" for c in NON_RECYCLABLE}}

FALLBACK_STATUS = "Recyclable"


# =========================
# DB helper with auto-reconnect
# =========================
class DB:
    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.conn = None
        self._connect()

    def _connect(self):
        if self.conn:
            try:
                self.conn.close()
            except Exception:
                pass
        self.conn = pymysql.connect(**self.cfg)

    def _ensure_conn(self):
        try:
            # ping will raise an exception if the connection is down
            self.conn.ping(reconnect=True)
        except Exception:
            # reconnect on failure
            self._connect()

    def fetch_processing_rows(self, limit: int = BATCH_LIMIT):
        self._ensure_conn()
        sql = f"""
            SELECT id, image
            FROM {TABLE_NAME}
            WHERE status = %s
            ORDER BY id ASC
            LIMIT %s
        """
        with self.conn.cursor() as cur:
            cur.execute(sql, ("Processing", limit))
            return cur.fetchall()

    def update_status(self, row_id: int, new_status: str):
        global cnn_classname
        print('New status updated = ' , new_status)
        self._ensure_conn()
        sql = f"UPDATE {TABLE_NAME} SET status = %s , item_name = %s WHERE id = %s"
        with self.conn.cursor() as cur:
            cur.execute(sql, (new_status, cnn_classname,  row_id))


# =========================
# Image helpers
# =========================
def b64_to_cv2_image(b64_str: str) -> Optional[np.ndarray]:
    try:
        if "," in b64_str[:50]:
            b64_str = b64_str.split(",", 1)[1]
        missing = len(b64_str) % 4
        if missing:
            b64_str += "=" * (4 - missing)
        img_bytes = base64.b64decode(b64_str, validate=False)
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None

def cv2_to_tk_image(cv2_img: np.ndarray, max_size: Tuple[int, int] = (640, 360)) -> ImageTk.PhotoImage:
    rgb = cv2.cvtColor(cv2_img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    pil_img.thumbnail(max_size)
    return ImageTk.PhotoImage(pil_img)


# =========================
# YOLO inference and decision
# =========================
class Classifier:
    def __init__(self, model_path: str):
        self.model = YOLO(model_path)

    def predict_status(self, img_bgr: np.ndarray):
        global cnn_classname

        results = self.model.predict(
            source=img_bgr,
            imgsz=IMG_SIZE,
            conf=0.001,      # allow all detections, we will filter manually
            verbose=False
        )

        best_cls = None
        best_status = None
        best_conf = 0.0

        for r in results:
            names = r.names
            if r.boxes is None:
                continue

            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                cls_name = names.get(cls_id, str(cls_id))
                print("class id:", cls_id)
                print("class name:", cls_name)

                # pick best
                if conf > best_conf:
                    best_conf = conf
                    best_cls = cls_name
                    best_status = CLASS_TO_STATUS.get(cls_name)  # may be None

        # ---------- apply "others" rule ----------
        # nothing detected
        if best_cls is None:
            cnn_classname = "others"
            return "others", None, 0.0

        # class not in our mapping OR low confidence
        if best_status is None or best_conf < CONF_THRESHOLD:
            cnn_classname = "others"
            return "others", None, best_conf

        # normal case
        cnn_classname = best_cls
        return best_status, best_cls, best_conf


# =========================
# GUI App
# =========================
class TrashServiceApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Trash Classifier Service")
        self.geometry("960x680")

        self._build_ui()

        # DB and model
        try:
            self.db = DB(DB_CONFIG)
            self.log("DB connected")
        except Exception as e:
            self.log(f"DB connect error: {e}")
            messagebox.showerror("Error", f"DB connection failed: {e}")
            self.db = None

        try:
            self.classifier = Classifier(YOLO_MODEL_PATH)
            self.log("Model loaded")
        except Exception as e:
            self.log(f"Model load error: {e}")
            messagebox.showerror("Error", f"YOLO model load failed: {e}")
            self.classifier = None

        # Worker control
        self.stop_event = threading.Event()
        self.worker_thread: Optional[threading.Thread] = None

    def _build_ui(self):
        top = ttk.Frame(self, padding=10)
        top.pack(fill=tk.X)

        self.btn_start = ttk.Button(top, text="Start", command=self.start_worker)
        self.btn_start.pack(side=tk.LEFT, padx=5)

        self.btn_stop = ttk.Button(top, text="Stop", command=self.stop_worker, state=tk.DISABLED)
        self.btn_stop.pack(side=tk.LEFT, padx=5)

        self.status_label = ttk.Label(top, text="Status: Idle")
        self.status_label.pack(side=tk.LEFT, padx=15)

        mid = ttk.Frame(self, padding=10)
        mid.pack(fill=tk.BOTH, expand=True)

        self.canvas = tk.Label(mid, relief=tk.SUNKEN, width=640, height=360, bg="#202020")
        self.canvas.pack(side=tk.LEFT, padx=10, pady=10)

        right = ttk.Frame(mid, padding=10)
        right.pack(side=tk.LEFT, fill=tk.Y)

        self.var_row_id = tk.StringVar(value="Row ID: -")
        self.var_class = tk.StringVar(value="Detected class: -")
        self.var_conf = tk.StringVar(value="Confidence: -")
        self.var_final = tk.StringVar(value="Final status: -")

        ttk.Label(right, textvariable=self.var_row_id).pack(anchor="w", pady=4)
        ttk.Label(right, textvariable=self.var_class).pack(anchor="w", pady=4)
        ttk.Label(right, textvariable=self.var_conf).pack(anchor="w", pady=4)
        ttk.Label(right, textvariable=self.var_final, font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=8)

        ttk.Separator(self).pack(fill=tk.X, padx=10, pady=10)

        bottom = ttk.Frame(self, padding=10)
        bottom.pack(fill=tk.BOTH, expand=True)
        ttk.Label(bottom, text="Activity log").pack(anchor="w")
        self.log_list = tk.Listbox(bottom, height=10)
        self.log_list.pack(fill=tk.BOTH, expand=True)

    def log(self, msg: str):
        ts = time.strftime("%H:%M:%S")
        self.log_list.insert(tk.END, f"[{ts}] {msg}")
        self.log_list.yview_moveto(1)

    def start_worker(self):
        if self.classifier is None or self.db is None:
            messagebox.showerror("Error", "Model or DB not ready")
            return
        if self.worker_thread and self.worker_thread.is_alive():
            return
        self.stop_event.clear()
        self.worker_thread = threading.Thread(target=self.worker_loop, daemon=True)
        self.worker_thread.start()
        self.btn_start.config(state=tk.DISABLED)
        self.btn_stop.config(state=tk.NORMAL)
        self.status_label.config(text="Status: Running")
        self.log("Worker started")

    def stop_worker(self):
        self.stop_event.set()
        self.btn_start.config(state=tk.NORMAL)
        self.btn_stop.config(state=tk.DISABLED)
        self.status_label.config(text="Status: Stopping...")
        self.log("Stopping requested")

    def worker_loop(self):
        while not self.stop_event.is_set():
            try:
                rows = self.db.fetch_processing_rows(limit=BATCH_LIMIT)
                if not rows:
                    self.status_label.config(text="Status: Running (no pending rows)")
                    time.sleep(SLEEP_SECONDS)
                    continue

                for row in rows:
                    if self.stop_event.is_set():
                        break
                    row_id = row["id"]
                    b64 = row["image"]
                    self.update_info(row_id=row_id, cls="-", conf="-", final="-")

                    img = b64_to_cv2_image(b64)
                    if img is None:
                        self.log(f"Row {row_id}: invalid base64 image, setting fallback")
                        self.db.update_status(row_id, FALLBACK_STATUS)
                        self.update_info(row_id=row_id, cls=None, conf=0.0, final=FALLBACK_STATUS)
                        continue

                    self.show_image(img)

                    final_status, top_cls, conf = self.classifier.predict_status(img)
                    self.db.update_status(row_id, final_status)

                    self.update_info(row_id=row_id, cls=top_cls, conf=conf, final=final_status)
                    self.log(f"Row {row_id}: {top_cls if top_cls else 'no class'} -> {final_status} ({conf:.2f})")

                self.status_label.config(text="Status: Running")
                time.sleep(SLEEP_SECONDS)

            except Exception as e:
                self.log(f"Worker error: {e}")
                time.sleep(SLEEP_SECONDS)

        self.status_label.config(text="Status: Stopped")
        self.log("Worker stopped")

    def show_image(self, cv2_img: np.ndarray):
        tk_img = cv2_to_tk_image(cv2_img, max_size=(640, 360))
        self.canvas.image = tk_img
        self.canvas.configure(image=tk_img)

    def update_info(self, row_id, cls, conf, final):
        self.var_row_id.set(f"Row ID: {row_id}")
        self.var_class.set("Detected class: -" if cls is None else f"Detected class: {cls}")
        if isinstance(conf, (int, float)):
            self.var_conf.set(f"Confidence: {conf:.2f}")
        else:
            self.var_conf.set("Confidence: -")
        self.var_final.set(f"Final status: {final}")


if __name__ == "__main__":
    app = TrashServiceApp()
    app.mainloop()
