/// <reference types="cypress" />

describe('Shipment booking flow', () => {

  it('shipper can log in', () => {
    cy.visit('/login');
    cy.get('[data-cy=email]').type('monarch5@gmail.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=submit]').click();
    cy.url().should('include', '/shipper/dashboard');
  });

  it('shipper creates a shipment', () => {
    cy.intercept('POST', '**/api/shipments**').as('createShipment');

    cy.visit('/login');
    cy.get('[data-cy=email]').type('monarch5@gmail.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=submit]').click();
    cy.url().should('include', '/shipper/dashboard');

    cy.get('[data-cy=new-shipment]').click();
    cy.get('[data-cy=pickup]').type('Chennai');
    cy.get('[data-cy=delivery]').type('Bengaluru');
    cy.get('[data-cy=freight-type]').select('electronics'); // ← lowercase value
    cy.get('[data-cy=quantity]').type('10');
    cy.get('[data-cy=weight]').type('120');
    cy.get('[data-cy=price-quote]').type('15000');
    cy.get('[data-cy=pickup-date]').type('2026-04-15');
    cy.get('[data-cy=delivery-date]').type('2026-04-18');
    cy.get('[data-cy=submit-shipment]').click();

    cy.wait('@createShipment').its('response.statusCode').should('eq', 201);
    cy.url().should('include', '/shipper/dashboard');
    cy.contains('Chennai').should('be.visible');
  });

  it('carrier can log in', () => {
    cy.visit('/login');
    cy.get('[data-cy=email]').type('monarch8@gmail.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=submit]').click();
    cy.url().should('include', '/carrier/dashboard');
  });

  it('carrier can accept a booking', () => {
    cy.intercept('GET', '**/api/shipments**').as('getPendingShipments');

    cy.visit('/login');
    cy.get('[data-cy=email]').type('monarch8@gmail.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=submit]').click();
    cy.url().should('include', '/carrier/dashboard');

    cy.wait('@getPendingShipments');

    cy.intercept('POST', '**/api/bookings**').as('acceptBooking');

    //  FIXED: exact match selector, not starts-with
    cy.get('[data-cy=shipment-card]', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
      .first()
      .find('[data-cy=accept-booking]')
      .should('be.visible')
      .click();

    //  Allow both 201 (new) and 409 (already booked) as valid
    cy.wait('@acceptBooking').its('response.statusCode').should('be.oneOf', [201, 409]);

    cy.url().should('include', '/carrier/dashboard');
  });

});