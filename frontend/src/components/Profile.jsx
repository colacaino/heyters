export default function Profile({ displayName, username, bio }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xl font-semibold text-white">{displayName || username}</p>
      <p className="text-sm text-gray-400">@{username}</p>
      {bio && <p className="text-sm text-gray-300 mt-2">{bio}</p>}
    </div>
  );
}
