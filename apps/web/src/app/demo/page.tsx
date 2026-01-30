import { AuthSkeleton } from '@/components/loaders'

const page = () => {
  return (
    <div className='h-screen flex items-center justify-center'>
        <AuthSkeleton />
    </div>
  )
}

export default page