const FeaturesSection = () => {
  const features = [
    {
      icon: "/icons/cut.svg",
      title: "Trim & Cut",
      description: "Easily trim and cut your videos.",
    },
    {
      icon: "/icons/music.svg",
      title: "Add Music",
      description: "Enhance your videos with background music.",
    },
    {
      icon: "/icons/text.svg",
      title: "Add Text",
      description: "Insert captions and titles.",
    },
    {
      icon: "/icons/filter.svg",
      title: "Apply Filters",
      description: "Use filters to make your videos pop.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold text-secondary mb-12">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-lg shadow-md">
              <img
                src={feature.icon}
                alt={feature.title}
                className="h-12 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-secondary">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
