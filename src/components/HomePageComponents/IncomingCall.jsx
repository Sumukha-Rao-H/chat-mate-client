import { useEffect, useState } from "react";
import { PhoneIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { useCall } from "../../context/callContext";

const CallNotification = ({ callerName, isVideoCall, onAccept, onDecline }) => {
  const [show, setShow] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Choose different ringtones for audio and video calls (optional)
  const ringtone = isVideoCall ? "/uploads/video_ringtone.mp3" : "/uploads/ringtone.mp3";
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
    <div className="fixed bottom-5 right-5 bg-gray-800 p-4 shadow-lg rounded-lg flex flex-col items-center w-64 z-50">
      <p className="text-lg text-white font-semibold">
        {isVideoCall ? "Incoming Video Call" : "Incoming Voice Call"}
      </p>
      <p className="text-md text-white">{callerName}</p>
      <p className="text-sm text-gray-200">{timeLeft}s</p>
      <div className="flex gap-4 mt-3">
        {/* Accept Call Button */}
        <button
          onClick={() => {
            setShow(false);
            audio.pause();
            onAccept();
          }}
          className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {isVideoCall ? (
            <VideoCameraIcon className="w-6 h-6" />
          ) : (
            <PhoneIcon className="w-6 h-6" />
          )}
        </button>

        {/* Decline Call Button */}
        <button
          onClick={() => {
            setShow(false);
            audio.pause();
            onDecline();
          }}
          className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PhoneIcon className="w-6 h-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};

export default CallNotification;
