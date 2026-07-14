export default function Home() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 40 }}>
      <h1>UrGigs Backend API</h1>
      <p>API routes available:</p>
      <ul>
        <li>POST /api/stripe/onboard</li>
        <li>POST /api/stripe/payment-intent</li>
        <li>POST /api/stripe/transfer</li>
        <li>POST /api/twilio/send</li>
        <li>GET /api/health</li>
      </ul>
    </div>
  );
}
