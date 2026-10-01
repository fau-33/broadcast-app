# 🚀 Broadcast SaaS App

A modern, multi-tenant Broadcast Management Application built with **React**, **TypeScript**, **Vite**, and **Firebase**. The platform allows users to manage WhatsApp connections, contacts, and scheduled message broadcasts with complete data isolation per client.

🌐 **Live Demo:** [https://broadcast-app-a33bc.web.app](https://broadcast-app-a33bc.web.app)  
📁 **Repository:** [https://github.com/fau-33/broadcast-app](https://github.com/fau-33/broadcast-app)

---

## 📌 Features

- **🔐 Authentication & Access Control:** Secure user sign-up and log-in powered by Firebase Auth, with automatic session cleanup upon registration.
- **📱 Connection Management:** Create and manage status for WhatsApp connection endpoints (`connections`).
- **📇 Contact Directory:** Store and manage recipient lists with custom details (`contacts`).
- **📢 Campaign & Broadcast Scheduler:** Create, organize, and schedule message broadcasts (`broadcasts`).
- **🛡️ Multi-Tenant Data Isolation:** Strict data segregation enforced directly at the database level via Firestore Security Rules (`isOwner()`).

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS / Lucide Icons
- **Backend & Database:** Firebase Firestore (Client SDK)
- **Authentication:** Firebase Authentication (Email / Password)
- **Hosting:** Firebase Hosting
- **Security:** Granular Firestore Rules (`firestore.rules`)

### 💡 Architectural Strategy (Spark Plan Optimization)

To run fully within Firebase's free **Spark Plan** (bypassing the Blaze plan credit card requirement), serverless Cloud Functions were replaced by direct integration with the **Firestore Client SDK**. Security and tenant isolation are guaranteed on the database tier through robust security rules matching document `userId` against `request.auth.uid`.

---

## 🔒 Security & Data Isolation (`firestore.rules`)

All documents in flat Firestore collections (`connections`, `contacts`, `broadcasts`) are locked to their respective creator. Cross-tenant access is impossible even via API calls:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner() {
      return isAuthenticated() && (
        resource == null
          ? request.resource.data.userId == request.auth.uid
          : resource.data.userId == request.auth.uid
      );
    }

    match /connections/{connectionId} {
      allow read, write: if isOwner();
    }

    match /contacts/{contactId} {
      allow read, write: if isOwner();
    }

    match /broadcasts/{broadcastId} {
      allow read, write: if isOwner();
    }
  }
}
```

📁 Project Structure

```
broadcast-app/
├── firebase.json          # Firebase Hosting and Firestore configuration
├── firestore.rules        # Security rules for multi-tenant isolation
└── web/                   # Frontend React + Vite application
    ├── public/            # Static assets
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Application views (Login, Connections, Contacts, Broadcasts)
    │   ├── services/      # Firestore and Auth SDK integration
    │   └── types/         # TypeScript definitions
    ├── package.json
    └── vite.config.ts
```

🚀 Getting Started
Prerequisites

```
Node.js (v18+)

npm or yarn

Firebase CLI (npm install -g firebase-tools)
```

1. Local Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/fau-33/broadcast-app.git
cd broadcast-app/web
npm install
```

2. Environment Variables

Create a .env file inside the /web directory with your Firebase config:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Run Locally

```bash
npm run dev
```

The application will start at http://localhost:5173.
📦 Build & Deployment
Build Frontend

```bash
cd web
npm run build
```

Deploy to Firebase Hosting & Rules

From the project root:

```bash
# Deploy Firestore Security Rules
firebase deploy --only firestore:rules

# Deploy Web Application
firebase deploy --only hosting
```

👤 Author

Flávio Leandro do Nascimento Félix

    GitHub: @fau-33

    Live App: broadcast-app-a33bc.web.app

---
