import { motion } from 'framer-motion';
import { FaLeaf, FaCloud, FaFeather } from 'react-icons/fa6';
const leaves = [{x:'7%',y:'16%',d:0},{x:'91%',y:'19%',d:1},{x:'13%',y:'77%',d:2},{x:'87%',y:'74%',d:3},{x:'49%',y:'8%',d:4}];
export default function FloatingBackground(){ return <div className="floating-bg" aria-hidden="true">
  <div className="cloud cloud-a"><FaCloud /></div><div className="cloud cloud-b"><FaCloud /></div>
  {leaves.map((leaf,i)=><motion.div key={i} className="leaf" style={{left:leaf.x,top:leaf.y}} initial={{rotate:0}} animate={{y:[0,-16,0],rotate:[-10,14,-10]}} transition={{duration:5+i,repeat:Infinity,delay:leaf.d,ease:'easeInOut'}}><FaLeaf /></motion.div>)}
  <motion.div className="butterfly" animate={{x:[0,32,0],y:[0,-14,0]}} transition={{duration:7,repeat:Infinity}}><FaFeather /></motion.div>
</div> }
