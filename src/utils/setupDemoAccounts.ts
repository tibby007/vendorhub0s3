
import { supabase } from '@/integrations/supabase/client';

export const setupDemoAccounts = async () => {
  console.log('Setting up demo accounts...');
  
  try {
    // Create demo partner admin account
    const { data: partnerAuthData, error: partnerAuthError } = await supabase.auth.signUp({
      email: 'demo-partner@vendorhub.com',
      password: 'DemoPass123!',
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: 'Demo Partner Admin',
          role: 'Partner Admin'
        }
      }
    });

    if (partnerAuthError && !partnerAuthError.message.includes('User already registered')) {
      console.error('Partner auth error:', partnerAuthError);
      return { success: false, error: partnerAuthError.message };
    }

    // Create demo vendor account
    const { data: vendorAuthData, error: vendorAuthError } = await supabase.auth.signUp({
      email: 'demo-vendor@vendorhub.com',
      password: 'DemoPass123!',
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: 'Demo Vendor User',
          role: 'Vendor'
        }
      }
    });

    if (vendorAuthError && !vendorAuthError.message.includes('User already registered')) {
      console.error('Vendor auth error:', vendorAuthError);
      return { success: false, error: vendorAuthError.message };
    }

    console.log('Demo accounts created successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Setup error:', error);
    return { success: false, error: 'Failed to create demo accounts' };
  }
};

export const createSampleData = async () => {
  console.log('Creating sample data...');
  
  try {
    // First, get the demo partner admin user ID
    const { data: partnerUser } = await supabase
      .from('users')
      .select('id, partner_id')
      .eq('email', 'demo-partner@vendorhub.com')
      .single();

    if (!partnerUser) {
      console.log('Partner user not found, skipping sample data creation');
      return { success: false, error: 'Partner user not found' };
    }

    // Create a sample partner organization if it doesn't exist
    let partnerId = partnerUser.partner_id as string | null;
    
    if (!partnerId) {
      const { data: newPartner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          name: 'Demo Financial Services',
          contact_email: 'demo-partner@vendorhub.com',
          contact_phone: '+1 (555) 123-4567'
        })
        .select()
        .single();

      if (partnerError) {
        console.error('Partner creation error:', partnerError);
        return { success: false, error: partnerError.message };
      }

      partnerId = newPartner.id;

      // Update the partner admin user with the partner_id
      await supabase
        .from('users')
        .update({ partner_id: partnerId })
        .eq('id', partnerUser.id);
    }

    // Get or create the demo vendor user
    const { data: vendorUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'demo-vendor@vendorhub.com')
      .single();

    if (vendorUser) {
      // Update vendor user with partner_id
      await supabase
        .from('users')
        .update({ partner_id: partnerId })
        .eq('id', vendorUser.id);

      // Create or update vendor record
      const { data: existingVendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', vendorUser.id)
        .single();

      if (!existingVendor) {
        await supabase
          .from('vendors')
          .insert({
            vendor_name: 'Demo Electronics Store',
            contact_email: 'demo-vendor@vendorhub.com',
            contact_phone: '+1 (555) 987-6543',
            contact_address: '123 Demo Street, Demo City, DC 12345',
            partner_id: partnerId!,
            user_id: vendorUser.id
          });
      }
    }

    // Create sample customer
    const { data: sampleCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        customer_name: 'John Demo Customer',
        email: 'john.demo@example.com',
        phone: '+1 (555) 555-1234',
        address: '456 Customer Lane, Customer City, CC 67890',
        biz_name: 'Demo Customer Business LLC',
        biz_phone: '+1 (555) 555-5678',
        biz_address: '789 Business Blvd, Business City, BC 11111',
        ein: '12-3456789',
        credit_permission: true
      })
      .select()
      .single();

    if (customerError && !customerError.message.includes('duplicate')) {
      console.error('Customer creation error:', customerError);
    }

    // Create sample resources
    const { error: resourceError } = await supabase
      .from('resources')
      .insert([
        {
          title: 'Q4 2024 Market Update',
          content: 'Latest market trends and financing opportunities for the fourth quarter.',
          type: 'Market Update',
          partner_id: partnerId!,
        },
        {
          title: 'New Application Guidelines',
          content: 'Updated guidelines for customer application submissions and requirements.',
          type: 'Guidelines',
          partner_id: partnerId!,
        }
      ]);

    if (resourceError && !resourceError.message.includes('duplicate')) {
      console.error('Resource creation error:', resourceError);
    }

    console.log('Sample data created successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Sample data error:', error);
    return { success: false, error: 'Failed to create sample data' };
  }
};
