const Footer = () => {
  return (
    <footer className="bg-secondary text-white py-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between space-y-8 md:space-y-0">
        <div className="space-y-4">
          <h3 className="text-xl font-bold">VideoEditor</h3>
          <p className="text-gray-400">Edit videos online with ease.</p>
        </div>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <a href="/" className="hover:text-accent">
                Home
              </a>
            </li>
            <li>
              <a href="/features" className="hover:text-accent">
                Features
              </a>
            </li>
            <li>
              <a href="/pricing" className="hover:text-accent">
                Pricing
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-accent">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Follow Us</h4>
          <div className="flex space-x-4">
            <a href="#">
              <img src="/icons/facebook.svg" alt="Facebook" className="h-6" />
            </a>
            <a href="#">
              <img src="/icons/twitter.svg" alt="Twitter" className="h-6" />
            </a>
            <a href="#">
              <img src="/icons/instagram.svg" alt="Instagram" className="h-6" />
            </a>
          </div>
        </div>
      </div>
      <div className="text-center mt-10 pt-6 border-t border-gray-700">
        <p>&copy; 2023 VideoEditor. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
