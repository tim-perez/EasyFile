import OrderCard from './OrderCard';

export default function CategoryColumn({ category, orders }) {
  return (
    <div style={{ flex: '1', minWidth: '300px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
      <h2 style={{ borderBottom: '3px solid #007bff', paddingBottom: '10px', marginTop: '0', fontSize: '1.2rem' }}>
        {category}
      </h2>
      
      {orders.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>No orders in this queue.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          {orders.map(order => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}