require("dotenv").config();

export default {
  expo: {
    name: "TrashTrack",
    slug: "trash-track",
    scheme: "trashtrack", // ✅ Required for Linking in production
    android: {
      package: "com.trashtrack.app" // ✅ Change to your unique package if needed
    },
    ios: {
      bundleIdentifier: "com.trashtrack.app" // ✅ Should match Android package (recommended)
    },
    extra: {
      baseurl : 'https://yhmysore.in/api/trashAPI.php',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        eas: {
        projectId: "2cae22fb-e0df-4a66-a33c-fdef679b879d", // ✅ Add your EAS project ID
      },
    },
  },
};
