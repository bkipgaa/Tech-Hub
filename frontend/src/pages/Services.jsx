import React from 'react';

const Services = () => {
  const services = [
    { name: "Web Development", description: "Custom websites and web applications", price: "$999+", color: "green" },
    { name: "UI/UX Design", description: "Beautiful and intuitive user interfaces", price: "$799+", color: "red" },
    { name: "Digital Marketing", description: "SEO, social media, and content strategy", price: "$599+", color: "green" },
    { name: "Mobile Development", description: "iOS and Android apps", price: "$1299+", color: "red" },
    { name: "Cloud Solutions", description: "AWS, Azure, and Google Cloud", price: "$1499+", color: "green" },
    { name: "Consulting", description: "Expert advice for your business", price: "$199/hr", color: "red" },
  ];

  return (
    <div className="py-12">
      <h1 className="text-4xl font-bold text-green-700 mb-8 text-center">Our Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div key={index} className={`bg-white p-6 rounded-xl shadow-lg border-b-4 border-${service.color}-500 hover:shadow-xl transition-shadow`}>
            <h3 className={`text-2xl font-bold text-${service.color}-600 mb-2`}>{service.name}</h3>
            <p className="text-gray-600 mb-4">{service.description}</p>
            <p className={`text-3xl font-bold text-${service.color}-600`}>{service.price}</p>
            <button className="mt-4 bg-gradient-to-r from-green-600 to-red-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-red-700">
              Learn More
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;