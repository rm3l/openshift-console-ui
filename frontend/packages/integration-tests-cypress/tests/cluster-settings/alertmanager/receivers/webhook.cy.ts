import * as _ from 'lodash';
import { checkErrors, testName } from '../../../../support';
import { alertmanager, getGlobalsAndReceiverConfig } from '../../../../views/alertmanager';
import * as yamlEditor from '../../../../views/yaml-editor';

const receiverName = `WebhookReceiver-${testName}`;
const receiverType = 'webhook';
const configName = `${receiverType}_configs`;
const severity = 'severity';
const warning = 'warning';
const webhookURL = 'http://mywebhookurl';
const updatedWebhookURL = 'http://myupdatedwebhookurl';

describe('Alertmanager: Webhook Receiver Form', () => {
  before(() => {
    cy.login();
    cy.initAdmin();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    alertmanager.reset();
  });

  it('creates and edits Webhook Receiver correctly', () => {
    cy.log('create Webhook Receiver');
    alertmanager.createReceiver(receiverName, configName);
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').should('be.checked');
    cy.byLegacyTestID('webhook-url').type(webhookURL);
    cy.byLegacyTestID('label-name-0').type(severity);
    cy.byLegacyTestID('label-value-0').type(warning);
    alertmanager.save();

    cy.log('verify Webhook Receiver was created correctly');
    alertmanager.validateCreation(receiverName, receiverType, severity, warning);
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(configs.receiverConfig.url).toBe(webhookURL);
      expect(_.has(configs.receiverConfig, 'send_resolved')).toBeFalsy();
    });

    cy.log('edits Webhook Receiver and saves advanced fields correctly');
    alertmanager.visitEditPage(receiverName);
    cy.byLegacyTestID('webhook-url').invoke('val').should('eq', webhookURL);
    cy.byLegacyTestID('webhook-url').clear();
    cy.byLegacyTestID('webhook-url').type(updatedWebhookURL);
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').click();
    alertmanager.save();

    cy.log('verify advanced fields were saved correctly');
    alertmanager.visitEditPage(receiverName);
    cy.byLegacyTestID('send-resolved-alerts').should('not.be.checked');
    alertmanager.visitAlertmanagerPage();
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(configs.receiverConfig.url).toBe(updatedWebhookURL);
      expect(configs.receiverConfig.send_resolved).toBeFalsy();
    });
  });
});