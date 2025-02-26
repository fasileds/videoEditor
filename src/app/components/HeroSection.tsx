const HeroSection = () => {
  return (
    <section className="bg-secondary text-white py-20">
      <div className="container mx-auto flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl font-bold">Edit Videos Like a Pro</h1>
          <p className="text-lg">
            Create stunning videos with our easy-to-use online video editor.
          </p>
          <button className="bg-accent px-6 py-3 rounded hover:bg-accent/90">
            Get Started
          </button>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0">
          <img
            src="/images/hero-video.png"
            alt="Video Editing"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
