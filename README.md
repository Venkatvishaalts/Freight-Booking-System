# Freight-Booking-System
Digital Freight Booking Platfrom

Features:
For Shippers:

 User Authentication - Secure email/password registration and login
 Post Shipments - Easy-to-use form to post freight requests
 Browse Carriers - View carrier profiles with ratings and reviews
 Real-time Tracking - Track shipments on interactive maps

For Carriers:

User Authentication - Professional profile creation
Browse Shipments - Search and filter available shipments
Accept Bookings - One-click shipment acceptance
Live Updates - Update shipment status in real-time

TECH STACK:

Backend:
1. Runtime          --        Node.js
2. Frameork         --        Express.js
3. Database         --        PostgreSQL
4. ORM              --        Sequlize
5. Authentication   --        JWT + bcrypt
6. Real Time        --        Socket.io 

Frontend: 
1. Framework        --        React.js
2. State Management --        Redux
3. UI Library       --        Ant Design
4. Styling          --        Tailwind CSS
5. HTTP Client      --        Axios
6. Maps             --        React Leaflet
7. Routing          --        React Router


Deployment:
Frontend Hosting  --Vercel
Backend Hosting   --Render
Database          --Supabase 

For Shippers:

1. Register as a shipper
2. Login
3. Post Shipment
4. Booking will be pending upto when carrier is accepting the booking
5. Tracking  can be done in Track shipment when carrier updates the location
For Carriers:

1. Register as a carrier
2. Login 
3. Click Accept Booking
4. In My bookings you can update the location
