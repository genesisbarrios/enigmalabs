import { Navbar, Nav, Container } from 'react-bootstrap';
import './Navigation.css'; // import your custom CSS file

const Navigation = () => {
    return (
        <>
            <Navbar collapseOnSelect fixed='top' expand="sm" bg="black" variant="dark">
                <Container id="navbarcontainer">
                    <Navbar.Brand href="#home">
                        <img width={150} src="logo.png" alt="Logo" />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls='responsive-navbar-nav' />
                    <Navbar.Collapse id='responsive-navbar-nav' className="custom-navbar-collapse">
                        <Nav>
                            <Nav.Link className="navLinks" href="/">Home</Nav.Link>
                            <Nav.Link className="navLinks" href="/About">About</Nav.Link>
                            <Nav.Link className="navLinks" href="/Music">Music</Nav.Link>
                            <Nav.Link className="navLinks" href="/Tech">Tech</Nav.Link>
                            <Nav.Link className="navLinks" href="/Visuals">Visuals</Nav.Link>
                            <Nav.Link className="navLinks" href="https://enigma-labs.printify.me/products">Merch</Nav.Link>
                            {/* <Nav.Link className="navLinks" href="/Blog">Blog</Nav.Link> */}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    )
}

export default Navigation;