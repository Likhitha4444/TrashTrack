import React from "react";
import { Container, Nav, Navbar, Button, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Home() {
    return (
        <div>
            {/* Navbar */}
            <Navbar expand="lg" sticky="top" className="navbar-modern">
                <Container>
                    <Navbar.Brand as={Link} to="/" className="fw-bold fs-3">
                        Trash<span className="text-danger">Track</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="navbar-nav" className="bg-success" />
                    <Navbar.Collapse id="navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link as={Link} to="/Login" className="nav-item-custom">Login</Nav.Link>

                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Hero Section */}
            <section className="hero-alt d-flex align-items-center">
                <Container className="text-center text-white">
                    <h1 className="fw-bold display-2">Manage Waste Smarter</h1>
                    <p className="lead mb-4">Track, recycle & build a cleaner tomorrow with smart tools.</p>
                    <Button as={Link} to="/login" size="lg" className="btn-alt">
                        Get Started
                    </Button>
                </Container>
            </section>




            {/* Custom CSS */}
            <style>{`
        body {
          font-family: 'Poppins', sans-serif;
        }
        .navbar-modern {
          background: #ece907ff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .nav-item-custom {
          margin-left: 20px;
          color: #333 !important;
          font-weight: 500;
        }
        .nav-item-custom:hover {
          color: #28a745 !important;
        }
        .hero-alt {
          background: url('https://images.unsplash.com/photo-1529070538774-1843cb3265df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80')
            center/cover no-repeat;
          min-height: 90vh;
          position: relative;
        }
        .hero-alt::before {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.5);
        }
        .hero-alt > .container {
          position: relative;
          z-index: 2;
        }
        .btn-alt {
          background: #28a745;
          border: none;
          padding: 12px 30px;
          font-weight: bold;
          border-radius: 30px;
          transition: 0.3s;
        }
        .btn-alt:hover {
          background: #1e7e34;
          transform: scale(1.05);
        }
        .feature-alt {
          border: none;
          border-radius: 15px;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .feature-alt:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .footer-alt {
          background: #222;
        }
      `}</style>
        </div>
    );
}
