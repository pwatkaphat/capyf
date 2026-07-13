import './SensorCard.css';

export default function SensorCard({ title, value, unit, icon: Icon, tone = 'green', hint, status = 'ปกติ', action }) {
  const hasValue = value !== null && value !== undefined;
  return (
    <article className={`sensor-card sensor-card--${tone}`}>
      <div className="sensor-card-top"><span className="sensor-icon"><Icon size={25} strokeWidth={2.2} /></span><span className="sensor-status"><i /> {hasValue ? status : 'รอข้อมูล'}</span></div>
      <div className="sensor-reading"><p>{title}</p><div><strong>{hasValue ? value : '--'}</strong><span>{unit}</span></div>{hint && <small>{hint}</small>}</div>
      {action && <div className="sensor-action">{action}</div>}
    </article>
  );
}
