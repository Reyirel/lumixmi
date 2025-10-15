import React from 'react'

export default function LoginPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Login</h1>
      <form>
        <div style={{ marginBottom: 12 }}>
          <label>Email:</label>
          <input type="email" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Contraseña:</label>
          <input type="password" />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </main>
  )
}
