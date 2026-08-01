import React, { useState, useEffect } from "react";
import { Container, Form, Button, Card, Table } from "react-bootstrap";
import axios from "axios";
import { baseUrl } from "../App";

export default function Addcenter() {
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        latitude: "",
        longitude: "",
        address:""
    });

    const [centers, setCenters] = useState([]);
    const [message, setMessage] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null); // store the ID internally

    // handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // CREATE or UPDATE
    const handleSave = async (e) => {
        e.preventDefault();

        try {
            if (isEditing) {
                // UPDATE
                const response = await axios.post(
                    baseUrl ,
                    new URLSearchParams({
                        tag: "edit_trash_centers",
                        id: editingId,
                        ...formData,
                    }),
                    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                );

                if (response.data.error === 0) {
                    setMessage("✏️ Center updated successfully!");
                    fetchCenters();
                } else {
                    setMessage("⚠️ Update failed.");
                }
            } else {
                // ADD
                const response = await axios.post(
                    baseUrl,
                    new URLSearchParams({
                        tag: "add_trash_center",
                        ...formData,
                    }),
                    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                );

                if (response.data.error === 0) {
                    setMessage("Center added successfully!");
                    fetchCenters();
                } else {
                    setMessage(response.data.message || "Failed to add center.");
                }
            }

            // Reset form
            setFormData({ name: "", mobile: "", latitude: "", longitude: "", address:"" });
            setIsEditing(false);
            setEditingId(null);
        } catch (error) {
            console.error(error);
            setMessage("❌ Error saving center.");
        }
    };

    // READ centers
    const fetchCenters = async () => {
         try {
      const response = await axios.post(
        baseUrl,
        new URLSearchParams({
          tag: 'get_trash_centers',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      setCenters(response.data.centers || []);
      console.log('Fetched centers:', response.data.centers);
    } catch (error) {
      console.error('Error fetching:', error);
      alert('Failed to fetch. Please try again later.');
    }
  };
    // DELETE center
    const handleDelete = async (id) => {
        try {
            const response = await axios.post(
                baseUrl,
                new URLSearchParams({ tag: "delete_trash_centers", id }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );

            if (response.data.error === 0) {
                setMessage("🗑️ Center deleted successfully!");
                fetchCenters();
            } else {
                setMessage("⚠️ Delete failed.");
            }
        } catch (error) {
            console.error(error);
            setMessage("❌ Error deleting center.");
        }
    };

    // EDIT center
    const handleEdit = (center) => {
        setFormData({
            name: center.name,
            mobile: center.mobile,
            latitude: center.latitude,
            longitude: center.longitude,
            address: center.address
        });
        setEditingId(center.id); // store ID internally
        setIsEditing(true);
    };

    useEffect(() => {
        fetchCenters();
    }, []);

    return (
        <div style={{ minHeight: "100vh", padding: "40px" }}>
            <Container style={{ maxWidth: "1000px" }}>
                {/* FORM CARD */}
                <Card className="p-4 shadow-lg mb-4" style={{ borderRadius: "15px" }}>
                    <h3 className="text-center mb-4" style={{ color: "#0077b6" }}>
                        {isEditing ? "✏️ Update Center" : "➕ Add Center"}
                    </h3>

                    {message && <div className="alert alert-info">{message}</div>}

                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label><b>Center Name</b></Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter Center Name"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><b>Mobile</b></Form.Label>
                            <Form.Control
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="Enter Mobile Number"
                                pattern="[0-9]{10}"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><b>Latitude</b></Form.Label>
                            <Form.Control
                                type="text"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="Latitude"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><b>Longitude</b></Form.Label>
                            <Form.Control
                                type="text"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="Longitude"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label><b>Address</b></Form.Label>
                            <Form.Control
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter Address"
                                required
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-between">
                            <Button type="submit" variant={isEditing ? "warning" : "success"} className="px-4">
                                {isEditing ? "✏️ Update" : "➕ Add"}
                            </Button>
                            {isEditing && (
                                <Button
                                    variant="secondary"
                                    className="px-4"
                                    onClick={() => {
                                        setFormData({ name: "", mobile: "", latitude: "", longitude: "" });
                                        setIsEditing(false);
                                        setEditingId(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </Form>
                </Card>

                {/* LIST CARD */}
                <Card className="p-3 shadow-lg" style={{ borderRadius: "15px" }}>
                    <h4 className="mb-3" style={{ color: "#0077b6" }}>📋 Center List</h4>
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Center Name</th>
                                <th>Mobile</th>
                                <th>Lat</th>
                                <th>Lng</th>
                                <th>Address</th>
                                <th style={{ width: "180px" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {centers.length > 0 ? (
                                centers.map((c, idx) => (
                                    <tr key={idx}>
                                        <td>{c.id}</td>
                                        <td>{c.name}</td>
                                        <td>{c.mobile}</td>
                                        <td>{c.latitude}</td>
                                        <td>{c.longitude}</td>
                                        <td>{c.address}</td>
                                        <td className="text-center">
                                            <Button
                                                size="sm"
                                                variant="info"
                                                className="me-2"
                                                onClick={() => handleEdit(c)}
                                            >
                                                ✏️ Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(c.id)}
                                            >
                                                🗑️ Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted">
                                        No centers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            </Container>
        </div>
    );
}
