export const CRO_EVENT_NAMES = [
  'funnel_landing_view',
  'experiment_exposure',
  'cta_click',
  'trust_block_view',
  'scroll_depth',
  'form_start',
  'form_step_complete',
  'form_attempt',
  'form_field_error',
  'form_api_error',
  'form_recaptcha_error',
  'form_honeypot_triggered',
  'form_submit_success',
  'form_submit_error',
  'form_abandon',
  'whitepaper_start',
  'cwv_metric',
  'exit_intent_mobile',
  'lead_score_assigned',
] as const;

export type CroEventName = (typeof CRO_EVENT_NAMES)[number];

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';

export interface CroBaseEvent {
  event_id: string;
  event_name: CroEventName | 'error_tracking_missing' | 'error_event_schema_mismatch';
  interaction_id: string;
  lang: string;
  route: string;
  segment: string;
  source: string;
  device: DeviceCategory;
}

export const EVENT_CATALOG = {
  funnel_landing_view: [],
  experiment_exposure: ['experiment_name', 'variant'],
  cta_click: ['cta_name', 'cta_position'],
  trust_block_view: ['block_name'],
  scroll_depth: ['percentile'],
  form_start: ['form_name'],
  form_attempt: ['form_name', 'attempt_number'],
  form_field_error: ['form_name', 'field', 'error_type', 'value_length'],
  form_api_error: ['form_name', 'error_code'],
  form_recaptcha_error: ['form_name'],
  form_honeypot_triggered: ['form_name'],
  form_submit_success: ['form_name'],
  form_submit_error: ['form_name', 'error_code'],
  form_abandon: ['form_name', 'last_field_focused', 'interaction_time'],
  whitepaper_start: ['source'],
  whitepaper_success: ['source'],
  whitepaper_error: ['source', 'error_code'],
  error_tracking_missing: ['missing_property'],
  error_event_schema_mismatch: ['schema_issue'],

  newsletter_subscribe: ['source'],
  mobile_menu_search: ['query_length'],
  mobile_menu_expand_section: ['section'],
  mobile_menu_navigation_failed: ['target_route'],
  form_error: ['form_name', 'field', 'error_type'],
  whitepaper_download: ['source'],
  whitepaper_download_error: ['source'],
  test_event: [],
  roi_calculator_interact: ['hours_saved', 'hourly_rate', 'employees'],
  form_field_interaction: ['form_name', 'field', 'interaction_type'],
  lead_synced: ['form_name', 'lead_status'],
  generate_lead: ['method'],
  quiz_step: ['step'],
  quiz_complete: ['size', 'goal', 'tech'],
  hero_cta_click: ['cta_type', 'slide_index'],
  booking_modal_open: ['source'],
  cwv_metric: ['metric_name', 'value', 'unit'],
  exit_intent_mobile: ['trigger', 'page'],
  form_step_complete: ['form_name', 'step'],
  lead_score_assigned: ['score', 'tier'],
} as const;

export function isKnownEvent(eventName: string): boolean {
  return Object.prototype.hasOwnProperty.call(EVENT_CATALOG, eventName);
}
