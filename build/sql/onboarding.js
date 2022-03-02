"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOnboardingSQL = void 0;
const buildOnboardingSQL = (input) => {
    return `
        BEGIN;



        do $$ 
        DECLARE
        new_company_id INTEGER; 
        admin_identity_id INTEGER;
        state_machine_id INTEGER;
        system_identity_id INTEGER;
        BEGIN


        -- Create Company
        INSERT INTO "Companies" (name, subdomain, slug,public_metadata) 
        VALUES 
        ('${input.company_name}', '${input.company_subdomain}', '${input.company_slug}','{"showIdOnPublicJobsApp": true}') returning id into new_company_id;

        -- Create First Admin User
        INSERT INTO "Identities" ("name_first", "name_last", "internal", "personal_email", "work_email", "mobile_phone", "company_id", "type_id") 
        VALUES 
        ('${input.identity_name_first}', '${input.identity_name_last}', true, '${input.identity_personal_email}', '${input.identity_work_email}', '${input.identity_mobile_phone}', (SELECT id FROM "Companies" WHERE subdomain = '${input.company_subdomain}'), 2) returning id into admin_identity_id;

        -- State Machine
        INSERT INTO "StateMachines" ("title", "company_id") 
        VALUES 
        ('Hiring', (SELECT id FROM "Companies" WHERE subdomain = '${input.company_subdomain}')) returning id into state_machine_id;



        -- Create System User
        INSERT INTO "Identities" ("name_first", "name_last", "internal", "company_id", "type_id") 
        VALUES 
            ('System', 'User', true, new_company_id, 0) returning id into system_identity_id;

        -- Identity Types
        INSERT INTO "IdentitySubTypes" ("type_name", "hex_color", "company_id", "default") 
        VALUES 
            ('W2', '#4692cc', new_company_id, true), 
            ('1099', '#4a1ba4', new_company_id, false);

        -- Termination Email
        INSERT INTO "Emails" ("subject", "fromEmail", "toEmail", "body", "company_id", "cc", "bcc", "type") 
        VALUES 
            ('Termination Notice', '@RM_EMAIL', '@PERSONAL_EMAIL', 'You have been terminated.',new_company_id, '@RM_EMAIL', '@AM_EMAIL', 'Termination');

        -- Candidate Statuses
        INSERT INTO "CandidateStatuses" ("status", "company_id", "updated_by", "default", "deletable") VALUES
            ('Active', new_company_id, admin_identity_id, 'f', 'f'),
            ('Terminated: Rehireable', new_company_id, admin_identity_id, 'f', 'f'),
            ('Terminated: Not Rehireable', new_company_id, admin_identity_id, 'f', 'f'),
            ('Resigned: Rehireable', new_company_id, admin_identity_id, 'f', 'f'),
            ('Resigned: Not Rehireable', new_company_id, admin_identity_id, 'f', 'f');

        -- Candidate Sources
        INSERT INTO "CandidateSources" ("text", "company_id") 
        VALUES
            ('Referral', new_company_id),
            ('Unknown', new_company_id),
            ('Internet Application', new_company_id),
            ('LinkedIn', new_company_id),
            ('Clearance Jobs', new_company_id);

        -- Roles
        INSERT INTO "Roles" ("title", "company_id", "cognito_group_name")
        VALUES 
            ('Admin', new_company_id, 'Admin'),
            ('Human Resources', new_company_id, 'Human_Resources'),
            ('Account Manager', new_company_id, 'Account_Manager'),
            ('Resource Manager', new_company_id, 'Resource_Manager'),
            ('Program Lead', new_company_id, 'Program_Lead');

        -- Stages
        INSERT INTO "Stages" ("name", "order", "company_id", "milestone", "conversion", "deleted", "state_machine_id", "permanently_deleted") 
        VALUES
            ('Interested', 0, new_company_id, 't', 'f', 'f', state_machine_id, 'f'),
            ('Resume Submitted', 1, new_company_id, 't', 'f', 'f', state_machine_id, 'f'),
            ('Interview', 2, new_company_id, 't', 'f', 'f', state_machine_id, 'f'),
            ('Send Offer', 3, new_company_id, 't', 'f', 'f', state_machine_id, 'f'),
            ('Offer Accepted', 4, new_company_id, 't', 'f', 'f', state_machine_id, 'f'),
            ('Started', 5, new_company_id, 't', 'f', 'f', state_machine_id, 'f');

        -- Stage Roles
        INSERT INTO "StageRoles" ("role_id", "stage_id", "cognito_group") 
            (SELECT 
            (SELECT id FROM "Roles" WHERE cognito_group_name = 'Admin' AND company_id = new_company_id), 
            id, 
            'Admin'
            FROM "Stages"
            WHERE company_id = new_company_id);

        -- People Widget Entitlements
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_PROFILE_INFO',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_PROFILE_INFO',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_CALCULATIONS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_CALCULATIONS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_EMPLOYMENTS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_EMPLOYMENTS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_TASK_INFORMATION',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_TASK_INFORMATION',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
            
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_FILES',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_FILES',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_ACTIVITY_FEED',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_ACTIVITY_FEED',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_WORKFLOW_OVERVIEW',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_WORKFLOW_OVERVIEW',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_EEO_INFO',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_EEO_INFO',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_RESUMES',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_RESUMES',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_TEAM_REVIEW',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CANDIDATE_TEAM_REVIEW',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_COMPENSATION_INFORMATION',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_BENEFITS_TRACKER',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_EMPLOYEE_MANAGEMENT_INFORMATION',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        -- Job Widget Entitlements
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_JOBS_WORKFLOW_OVERVIEW',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_JOBS_GENERAL_INFO',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_JOBS_EMPLOYMENTS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_JOBS_DETAILS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        -- Contract Widget Entitlements
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CONTRACTS_GENERAL_INFO',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CONTRACTS_COMMENTS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CONTRACTS_CLIENT_POC',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CONTRACTS_ASSOCIATED_JOBS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CONTRACTS_ASSOCIATED_EMPLOYEES',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','WIDGET_CONTRACTS_ASSOCIATED_CANDIDATES',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        -- Module Entitlements
        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_ANALYTICS_STAGE',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_CONTRACTS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_CALCULATOR',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_DASHBOARD',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_JOBS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_BOARD',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_ANALYTICS_ACTIVITY',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_TASKS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_EMPLOYEES',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_CANDIDATES',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        INSERT INTO "Entitlements" ("intent", "category", "company_id", "created_by", "state", "updated_by", "role_id", "description")
            (SELECT 'FULL_ACCESS','MODULE_APPLICANTS',new_company_id,admin_identity_id,'ACTIVE',null,r.id,'' FROM "Roles" r WHERE company_id = new_company_id);

        END $$;

        COMMIT;
    `;
};
exports.buildOnboardingSQL = buildOnboardingSQL;
