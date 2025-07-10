import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  LogIn, 
  UserPlus,
  Sparkles,
  Moon,
  Sun,
  Bookmark,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FloatingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '#public-collections', label: '인기 컬렉션', icon: Globe },
    { href: '#features', label: '기능', icon: Sparkles },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // 현재 페이지에 해당 섹션이 없으면 메인 페이지로 이동
      window.location.href = `/${sectionId}`;
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] transition-all duration-500 supports-[backdrop-filter]:bg-background/80',
          isScrolled
            ? 'bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-lg'
            : 'bg-background/70 backdrop-blur-md border-b border-white/20 shadow-md'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-linkbox-blue to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: isMobile ? 1.05 : 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </motion.div>
              <span className="font-bold text-lg sm:text-xl text-foreground drop-shadow-sm group-hover:text-primary transition-colors duration-300">
                {isMobile ? 'linku.me' : 'linku.me'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
              {navItems.map((item) => (
                <motion.button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="text-sm font-medium text-foreground/90 hover:text-primary transition-colors duration-300 drop-shadow-sm whitespace-nowrap"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                </motion.button>
              ))}
              
              <div className="flex items-center space-x-2 lg:space-x-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleTheme}
                    className="backdrop-blur-sm bg-background/20 hover:bg-background/40 border border-border/30 shadow-sm p-2"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    asChild
                    className="backdrop-blur-sm bg-background/20 hover:bg-background/40 border border-border/30 shadow-sm hidden lg:flex"
                  >
                    <Link to="/login">
                      <LogIn className="h-4 w-4 mr-1" />
                      로그인
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="sm" 
                    asChild
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link to="/signup">
                      <UserPlus className="h-4 w-4 mr-1 lg:mr-1" />
                      <span className="hidden lg:inline">회원가입</span>
                      <span className="lg:hidden">가입</span>
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Mobile Hamburger */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="md:hidden"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="backdrop-blur-sm bg-background/20 hover:bg-background/40 border border-border/30 shadow-sm h-10 w-10 md:hidden"
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 sm:top-14 left-0 right-0 z-[99] bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-xl md:hidden supports-[backdrop-filter]:bg-background/90"
          >
            <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="flex items-center space-x-5 w-full p-6 text-left hover:bg-accent/50 rounded-xl transition-all duration-300 min-h-[70px] active:bg-accent/70"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="font-medium text-xl">{item.label}</span>
                </motion.button>
              ))}
              
              <div className="border-t border-border/50 pt-8 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start backdrop-blur-sm bg-background/20 hover:bg-background/40 border border-border/30 h-16 text-xl" 
                    onClick={toggleTheme}
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mr-4">
                      {theme === 'dark' ? <Sun className="h-7 w-7 text-primary" /> : <Moon className="h-7 w-7 text-primary" />}
                    </div>
                    {theme === 'dark' ? '라이트 모드' : '다크 모드'}
                  </Button>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start backdrop-blur-sm bg-background/20 hover:bg-background/40 border border-border/30 h-16 text-xl" 
                    asChild
                  >
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mr-4">
                        <LogIn className="h-7 w-7 text-primary" />
                      </div>
                      로그인
                    </Link>
                  </Button>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-16 text-xl font-semibold" 
                    asChild
                  >
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/20 mr-4">
                        <UserPlus className="h-7 w-7 text-white" />
                      </div>
                      회원가입
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[98] bg-black/50 backdrop-blur-sm md:hidden supports-[backdrop-filter]:bg-black/30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
} 