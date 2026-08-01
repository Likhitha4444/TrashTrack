import React from 'react'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { Link, Outlet } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div>
       <Navbar bg="danger" data-bs-theme="dark">
        <Container>
          <Navbar.Brand className='fw-bold'>Trash Track</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link as={Link} className='fw-bold' to='/AdminDashboard/Addcenter'>Add Trash Center</Nav.Link>           
            <Nav.Link as={Link} className='fw-bold' to='/'>Logout</Nav.Link>           
          </Nav>
        </Container>
      </Navbar>
      <Outlet/>
    </div>
  )
}
