import React from 'react';
import { AccountSetupWizard } from '../../../widgets/account-setup-wizard';

export const OnboardingPage: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center">
      <AccountSetupWizard />
    </div>
  );
};
