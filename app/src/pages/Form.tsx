import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  name: z.string(),
  age: z.number(),
})

export function Form() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form
      onSubmit={handleSubmit((data) => {
        // handle inputs
        console.log(data)
        console.log(formState)
      })}
    >
      <input {...register('name')} />
      <input {...register('age', { valueAsNumber: true })} type='number' />
      <input type='submit' />
    </form>
  )
}
