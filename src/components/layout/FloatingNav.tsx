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
          'fixed top-0 left-0 right-0 z-[9999] transition-all duration-300',
          isScrolled
            ? 'bg-background/80 backdrop-blur-md border-b shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-linkbox-blue to-purple-600 rounded-lg flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">
                {isMobile ? 'L.M' : 'linku.me'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">
                      <LogIn className="h-4 w-4 mr-1" />
                      로그인
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/signup">
                      <UserPlus className="h-4 w-4 mr-1" />
                      회원가입
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile Hamburger */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
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
            transition={{ duration: 0.2 }}
            className="fixed top-14 left-0 right-0 z-[9998] bg-background/95 backdrop-blur-md border-b shadow-lg md:hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="flex items-center space-x-3 w-full p-3 text-left hover:bg-accent rounded-lg transition-colors"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              <div className="border-t pt-4 space-y-3">
                <Button variant="ghost" className="w-full justify-start" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === 'dark' ? '라이트 모드' : '다크 모드'}
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <LogIn className="h-4 w-4 mr-2" />
                    로그인
                  </Link>
                </Button>
                <Button className="w-full justify-start" asChild>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    회원가입
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9997] bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
} 