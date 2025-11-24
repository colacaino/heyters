export default function Notification({ title, message, date }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h4 className="text-md font-semibold text-white">{title}</h4>
      <p className="text-sm text-gray-300 mt-1">{message}</p>
      {date && (
        <p className="text-xs text-gray-500 mt-2">
          {new Date(date).toLocaleString()}
        </p>
      )}
    </div>
  );
}
