export default function Battle({ title, status, onClick }) {
  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-500 transition cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">Estado: {status}</p>
    </div>
  );
}
