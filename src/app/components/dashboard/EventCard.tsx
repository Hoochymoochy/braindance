export default function Card({ title, value }: { title: string; value: string }) {
    return (
      <div className="border-card">
        <h3 className="text-sm gradient-text">{title}</h3>
        <p className="text-2xl gradient-text mt-1">{value}</p>
      </div>
    );
  }
  