"use client"
import React from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

const Header = () => {

    const {data:session} = useSession()
    const handleSignOut = async()=>{
            try {
                await signOut()
            } catch (error) {
                
            }
    }
  return (
    <div>
        <button onClick={handleSignOut}>Sign Out</button>
        {session?(
        <div>
            Welcome
        </div>):(
            <div>
            <Link href="/login"></Link>
            <Link href="/register"></Link>
            </div>

        )}
    </div>
  )
}

export default Header
