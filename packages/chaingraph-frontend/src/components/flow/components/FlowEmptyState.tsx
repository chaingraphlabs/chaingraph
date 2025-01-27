import { Share1Icon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { MousePointerClick, Workflow } from 'lucide-react'

const gridVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

const features = [
  {
    title: 'Visual Programming',
    description: 'Create complex workflows using intuitive drag-and-drop interface',
    icon: Workflow,
  },
  {
    title: 'Real-time Sync',
    description: 'All changes are automatically synchronized with the server',
    icon: Share1Icon,
  },
  {
    title: 'Node Library',
    description: 'Access a wide range of pre-built nodes for different tasks',
    icon: Share1Icon,
  },
  {
    title: 'Live Preview',
    description: 'See your changes in real-time as you build your flow',
    icon: Share1Icon,
  },
]

export function FlowEmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center ">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial="initial"
        animate="animate"
        variants={gridVariants}
      >
        {/* Icon */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          <div className="relative inline-block">
            <Share1Icon className="w-16 h-16 text-muted-foreground/30" />
            <motion.div
              className="absolute -right-2 -bottom-2"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            >
              <MousePointerClick className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-2xl font-semibold mb-3 text-foreground"
          variants={itemVariants}
        >
          No Flow Selected
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-muted-foreground mb-8"
          variants={itemVariants}
        >
          Select an existing flow from the sidebar or create a new one to get started
        </motion.p>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-2 gap-4 max-w-xl mx-auto"
          variants={gridVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="p-4 rounded-lg bg-card border text-left"
              variants={itemVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">
                  {feature.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-[0.03]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.03 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 grid grid-cols-8 gap-px [&>div]:bg-foreground">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
