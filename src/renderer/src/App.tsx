import { toast, Toaster } from 'sonner'
import { QueryProvider } from './providers/query-provider'

function App(): React.JSX.Element {
  return (
    <QueryProvider>
      <Toaster richColors />
      <h1 className="text-3xl font-bold underline">Hello World</h1>
      <button onClick={() => toast.success('Hello')}>Click me</button>
    </QueryProvider>
  )
}

export default App
