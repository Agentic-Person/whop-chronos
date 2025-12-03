/**
 * Centralized test constants for development mode
 *
 * These constants are used when DEV_BYPASS_AUTH=true to bypass Whop authentication
 * during local development and testing. They provide mock user and company data
 * that allows developers to test the application without requiring real Whop credentials.
 *
 * IMPORTANT: These are ONLY used in development mode. In production, real Whop
 * authentication is always required.
 */

export const TEST_USER_ID = 'user_test_00000000000000';
export const TEST_CREATOR_ID = 'user_test_creator_00000000';
export const TEST_STUDENT_ID = 'user_test_student_00000000';
export const TEST_COMPANY_ID = 'biz_test_00000000';
export const TEST_EXPERIENCE_ID = 'exp_test_00000000';

/**
 * Mock creator user data for testing
 * Used in creator dashboard layout when TEST_MODE is enabled
 */
export const TEST_CREATOR_USER = {
  id: TEST_USER_ID,
  email: 'creator@test.chronos.ai',
  username: 'test_creator',
  name: 'Test Creator',
  profile_pic_url: null,
};

/**
 * Mock student user data for testing
 * Used in student experience layout when TEST_MODE is enabled
 */
export const TEST_STUDENT_USER = {
  id: TEST_STUDENT_ID,
  email: 'student@test.chronos.ai',
  username: 'test_student',
  name: 'Test Student',
  profile_pic_url: null,
};

/**
 * Mock company data for testing
 * Used when creator dashboard needs company information
 */
export const TEST_COMPANY = {
  id: TEST_COMPANY_ID,
  title: 'Test Company',
  image_url: null,
};

/**
 * Mock experience data for testing
 * Used when student layout needs experience information
 */
export const TEST_EXPERIENCE = {
  id: TEST_EXPERIENCE_ID,
  name: 'Test Experience',
  company_id: TEST_COMPANY_ID,
};
