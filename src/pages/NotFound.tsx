
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#d8e6f3] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-8 max-w-md w-full text-center"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-white/70 flex items-center justify-center mx-auto mb-6"
        >
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </motion.div>
        
        <h1 className="text-4xl font-medium mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Page not found</p>
        
        <p className="text-sm text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Button 
          asChild
          variant="default"
          className="rounded-xl px-6 py-2 h-auto"
        >
          <a href="/">
            <Home className="h-4 w-4 mr-2" />
            Return to Home
          </a>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
