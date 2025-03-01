import { useEffect, useState } from "react";
import { PhoneIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

const CallNotification = ({ callerName, isVideoCall, onAccept, onDecline }) => {
  const [show, setShow] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);

  // Choose different ringtones for audio and video calls (optional)
  const ringtone = "/uploads/ringtone.mp3";
  const audio = new Audio(ringtone);

  useEffect(() => {
    // Start ringing when the component is mounted
    audio.loop = true;
    audio.play();

    // Countdown timer for auto-decline
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          setShow(false);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      audio.pause();
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 backdrop-blur-lg bg-gray-800/80 text-white shadow-xl rounded-xl px-6 py-4 flex flex-col items-center w-72 transform transition-all duration-500 ease-out z-50 ${
        show ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
      }`}
    >
      <p className="text-lg font-semibold">
        {isVideoCall ? "Incoming Video Call" : "Incoming Voice Call"}
      </p>
      <p className="text-md">{callerName}</p>
      <p className="text-sm text-gray-300">{timeLeft}s</p>

      <div className="flex gap-6 mt-4">
        {/* Accept Call Button */}
        <button
          onClick={() => {
            setShow(false);
            audio.pause();
            onAccept();
          }}
          className="bg-green-500 text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-md hover:bg-green-600 transition-all duration-200"
        >
          {isVideoCall ? (
            <VideoCameraIcon className="w-7 h-7" />
          ) : (
            <PhoneIcon className="w-7 h-7" />
          )}
        </button>

        {/* Decline Call Button */}
        <button
          onClick={() => {
            setShow(false);
            audio.pause();
            onDecline();
          }}
          className="bg-red-500 text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-md hover:bg-red-600 transition-all duration-200"
        >
          <PhoneIcon className="w-7 h-7 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};

export default CallNotification;
