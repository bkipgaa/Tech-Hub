import React from 'react';

const Home = () => {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-green-700 mb-4">Welcome to WeBA-Hub</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your digital solution with a passion for <span className="text-green-600 font-semibold">green</span> and <span className="text-red-500 font-semibold">red</span> innovation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {[
          { title: "Web Development", color: "green", icon: "💻" },
          { title: "UI/UX Design", color: "red", icon: "🎨" },
          { title: "Digital Marketing", color: "green", icon: "📱" }
        ].map((item, index) => (
          <div key={index} className={`bg-white p-8 rounded-2xl shadow-xl border-l-8 border-${item.color}-500 hover:shadow-2xl transition-shadow`}>
            <div className="text-4xl mb-4">{item.icon}</div>
            <h3 className={`text-2xl font-bold text-${item.color}-700 mb-3`}>{item.title}</h3>
            <p className="text-gray-600">Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;