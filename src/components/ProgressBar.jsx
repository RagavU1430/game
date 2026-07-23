import { motion } from 'framer-motion';
export default function ProgressBar({value}){return <div className="progress-track" aria-label={`${value}% complete`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}><motion.div className="progress-fill" animate={{width:`${value}%`}} transition={{type:'spring',stiffness:75,damping:18}} /></div>}
