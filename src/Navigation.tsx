import { Navbar, Nav, Container } from 'react-bootstrap';

const Navigation = () => {
    return (
        <>
            <Navbar collapseOnSelect fixed='top' expand="sm" bg="black" variant="dark">
                <Container id="navbarcontainer">
                    <h3>ENIGMA SOFTWARE CONSULTING</h3>
                    <Navbar.Toggle aria-controls='responsive-navbar-nav'></Navbar.Toggle>
                    <Navbar.Collapse id='responsive-navbar-nav'>
                        <Nav>
                            <Nav.Link className="navLinks" href="/">Home</Nav.Link>
                            <Nav.Link className="navLinks" href="/About">About</Nav.Link>
                            <Nav.Link className="navLinks" href="/Blog">Blog</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    )
}

export default Navigation;