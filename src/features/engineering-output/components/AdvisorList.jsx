export function AdvisorList({ messages = [] }) {
  return (
    <div className="advisor-list">
      {messages.map((item, index) => (
        <div key={`${item.title}-${index}`} className={`advisor-card advisor-card--${item.severity}`}>
          <strong>{item.title}</strong>
          <p>{item.message}</p>
        </div>
      ))}
    </div>
  );
}
