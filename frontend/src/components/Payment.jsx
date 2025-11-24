export default function Payment({ amount, status, description }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex justify-between">
        <span className="text-lg font-bold text-white">${amount}</span>
        <span className="text-sm uppercase text-gray-400">{status}</span>
      </div>
      {description && <p className="text-sm text-gray-400 mt-2">{description}</p>}
    </div>
  );
}
