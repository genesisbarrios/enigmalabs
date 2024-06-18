import { Navbar, Nav, Container } from 'react-bootstrap';

const Navigation = () => {
    return (
        <>
            <Navbar collapseOnSelect fixed='top' expand="sm" bg="black" variant="dark">
                <Container id="navbarcontainer">
                    <Navbar.Brand href="#home">
                        <img width={150} src="logo.png" alt="Logo" />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls='responsive-navbar-nav' />
                    <Navbar.Collapse id='responsive-navbar-nav' className="justify-content-end">
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