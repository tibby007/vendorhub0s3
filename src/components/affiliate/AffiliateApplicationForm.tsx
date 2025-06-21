
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, Globe, Users, TrendingUp } from 'lucide-react';

const affiliateApplicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  company: z.string().min(2, 'Company/Organization name is required'),
  website: z.string().url('Please enter a valid website URL').or(z.literal('')),
  socialMedia: z.string().optional(),
  experience: z.string().min(10, 'Please describe your affiliate marketing experience'),
  marketingChannels: z.string().min(10, 'Please describe your marketing channels'),
  audienceDescription: z.string().min(20, 'Please provide a brief description of your audience')
});

type AffiliateApplicationForm = z.infer<typeof affiliateApplicationSchema>;

const AffiliateApplicationForm = () => {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AffiliateApplicationForm>({
    resolver: zodResolver(affiliateApplicationSchema)
  });

  const onSubmit = async (data: AffiliateApplicationForm) => {
    try {
      // Simulate form submission
      console.log('Affiliate application submitted:', data);
      
      // Here you would typically send the data to your backend
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest in our affiliate program. We'll review your application and get back to you within 2-3 business days.",
      });
      
      reset();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-vendor-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Our Affiliate Program</h2>
        <p className="text-gray-600">
          Earn up to 20% recurring commission by referring Partner Admins to VendorHub
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="John Doe"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="company" className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4" />
              Company/Organization *
            </Label>
            <Input
              id="company"
              {...register('company')}
              placeholder="Your Company Name"
              className={errors.company ? 'border-red-500' : ''}
            />
            {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="website" className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" />
              Website URL
            </Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://yourwebsite.com"
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>}
          </div>

          <div>
            <Label htmlFor="socialMedia" className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              Social Media Links
            </Label>
            <Input
              id="socialMedia"
              {...register('socialMedia')}
              placeholder="LinkedIn, Twitter, etc."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="experience" className="mb-2 block">
            Affiliate Marketing Experience *
          </Label>
          <Textarea
            id="experience"
            {...register('experience')}
            placeholder="Tell us about your experience with affiliate marketing, partnerships, or sales..."
            className={errors.experience ? 'border-red-500' : ''}
            rows={4}
          />
          {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience.message}</p>}
        </div>

        <div>
          <Label htmlFor="marketingChannels" className="mb-2 block">
            Marketing Channels *
          </Label>
          <Textarea
            id="marketingChannels"
            {...register('marketingChannels')}
            placeholder="What marketing channels do you plan to use? (Email, social media, content marketing, etc.)"
            className={errors.marketingChannels ? 'border-red-500' : ''}
            rows={3}
          />
          {errors.marketingChannels && <p className="text-red-500 text-sm mt-1">{errors.marketingChannels.message}</p>}
        </div>

        <div>
          <Label htmlFor="audienceDescription" className="mb-2 block">
            Audience Description *
          </Label>
          <Textarea
            id="audienceDescription"
            {...register('audienceDescription')}
            placeholder="Describe your target audience and how they would benefit from VendorHub..."
            className={errors.audienceDescription ? 'border-red-500' : ''}
            rows={4}
          />
          {errors.audienceDescription && <p className="text-red-500 text-sm mt-1">{errors.audienceDescription.message}</p>}
        </div>

        <div className="bg-vendor-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-vendor-green-800 mb-2">Program Benefits:</h3>
          <ul className="text-sm text-vendor-green-700 space-y-1">
            <li>• Up to 20% recurring commission on all referrals</li>
            <li>• Dedicated affiliate support and resources</li>
            <li>• Monthly payouts and detailed reporting</li>
            <li>• Marketing materials and training provided</li>
          </ul>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-vendor-green-600 hover:bg-vendor-green-700"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </div>
  );
};

export default AffiliateApplicationForm;
