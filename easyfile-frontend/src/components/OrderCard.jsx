import styles from './OrderCard.module.css';

export default function OrderCard({ order }) {
  return (
    <div className={styles.orderCard}>
      <h3 className={styles.orderTitle}>Order #{order.orderId}</h3>
      <p className={styles.orderDetail}>
        <strong>Status:</strong> 
        <span className={order.status === 'Pending' ? styles.statusPending : styles.statusCompleted}>
          {order.status}
        </span>
      </p>
      <p className={styles.orderSummary}><strong>Summary:</strong> {order.summary}</p>
    </div>
  );
}