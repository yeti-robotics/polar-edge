function ProfileStats() {
    return (
        <main>
        <h1 className="text-2xl font-bold mb-4"> Scouting Profile Page </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Scouting Stats</h2>
            <p>Matches Scouted: 15</p>
            <p>Teams Analyzed: 8</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
            <p>Average Score: 85</p>
            <p>Accuracy Rate: 92%</p>
          </div>
        </div>
    </main>

    );
}
export default ProfileStats;