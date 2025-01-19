import React,{useState, useEffect} from "react";
import { getAuth } from "firebase/auth";

const Sidebar = ({handleSelectConversation}) => {

	const [loading, setLoading] = useState(false);
	const [friends, setFriends] = useState([]);

	const auth = getAuth();
	const user = auth.currentUser;
	
	useEffect(() => {
		fetchFriends(user);
	}, [user]);

	const fetchFriends = async (userId) => {
		try {
			setLoading(true);
			const response = await fetch(`http://localhost:5000/api/get-friends?uid=${encodeURIComponent(user.uid)}`, {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch friends list");
			}

			const friendsList = await response.json();
			setFriends(friendsList);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching friends:", error);
			setLoading(false);
		}
	};
	
	return (
		<div className="w-full md:w-1/4 bg-gray-200 border-r border-gray-300 flex-grow">
			{/* Desktop Sidebar */}
			<div className="hidden md:flex flex-col h-full">
				{/* Sidebar Header */}
				<div className="bg-gray-200 px-5 py-4 shadow-md">
					<h1 className="text-2xl font-bold text-gray-800">Chats</h1>
				</div>
	
				{/* Sidebar Content (Scrollable) */}
				<div className="flex-grow overflow-y-auto">
					{loading ? (
						<div className="p-4 text-gray-600">Loading friends...</div>
					) : (
						friends.map((friend) => (
							<div
								key={friend.uid}
								className="flex items-center justify-between px-5 py-3 hover:bg-gray-300 cursor-pointer transition-all"
								onClick={() => handleSelectConversation(friend)}
							>
								<div>
									<div className="font-semibold text-gray-800">{friend.displayName}</div>
									<div className="text-sm text-gray-500">{friend.lastMessage || "Start a conversation"}</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>
	
			{/* Mobile Sidebar */}
			<div className="w-full bg-gray-200 border-b border-gray-300 md:hidden fixed inset-0 z-10">
				<div className="flex flex-col h-full">
					<div className="bg-gray-200 px-5 py-4 shadow-md">
						<h1 className="text-xl font-bold text-gray-800">Chats</h1>
					</div>
					<div className="flex-grow overflow-y-auto">
						{loading ? (
							<div className="p-4 text-gray-600">Loading friends...</div>
						) : (
							friends.map((friend) => (
								<div
									key={friend.uid}
									className="flex items-center justify-between px-5 py-3 hover:bg-gray-300 cursor-pointer transition-all"
									onClick={() => handleSelectConversation(friend)}
								>
									<div>
										<div className="font-semibold text-gray-800">{friend.displayName}</div>
										<div className="text-sm text-gray-500">{friend.lastMessage || "Start a conversation"}</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
	
};

export default Sidebar;