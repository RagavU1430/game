import { motion } from 'framer-motion';
export default function Button({ children, className = '', type = 'button', ...props }) {
  return <motion.button type={type} className={`button ${className}`} whileHover={{ scale: 1.035, y: -2 }} whileTap={{ scale: .97 }} {...props}><span>{children}</span><i /></motion.button>;
}
