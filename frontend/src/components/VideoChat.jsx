export default function VideoChat({ localRef, remoteRef, muted = true }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <video
        ref={localRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full rounded-lg border border-gray-700 bg-black"
      ></video>
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        className="w-full rounded-lg border border-gray-700 bg-black"
      ></video>
    </div>
  );
}
