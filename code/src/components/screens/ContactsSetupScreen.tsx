import { useState } from 'react';
import { Plus, Trash2, ChevronRight, User, Phone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/appContext';

const relationships = ['Parent', 'Spouse', 'Sibling', 'Friend', 'Other'];

export function ContactsSetupScreen() {
  const { emergencyContacts, addContact, removeContact, setScreen } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleAddContact = () => {
    if (name && phone && relationship) {
      const priority = emergencyContacts.length === 0 ? 'primary' : 
                       emergencyContacts.length === 1 ? 'secondary' : 'tertiary';
      addContact({ name, phone, relationship, priority });
      setName('');
      setPhone('');
      setRelationship('');
      setShowForm(false);
    }
  };

  const canContinue = emergencyContacts.length >= 1;

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <p className="text-sm text-primary font-medium mb-2">Step 3 of 4</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Emergency Contacts
          </h1>
          <p className="text-muted-foreground">
            Add people who will be notified in an emergency
          </p>
        </div>

        {/* Contacts list */}
        <div className="space-y-3 mb-4">
          {emergencyContacts.map((contact, i) => (
            <div 
              key={contact.id} 
              className="glass-card p-4 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    contact.priority === 'primary' ? 'bg-primary text-primary-foreground' :
                    contact.priority === 'secondary' ? 'bg-alert text-alert-foreground' :
                    'bg-secondary text-foreground'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    contact.priority === 'primary' ? 'bg-primary/10 text-primary' :
                    contact.priority === 'secondary' ? 'bg-alert/10 text-alert' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {contact.priority}
                  </span>
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="p-2 text-muted-foreground hover:text-emergency transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add contact form */}
        {showForm ? (
          <div className="glass-card p-5 mb-4 animate-scale-in">
            <h3 className="font-medium text-foreground mb-4">New Contact</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contact name"
                  className="w-full h-12 bg-secondary/50 border border-border rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-12 bg-secondary/50 border border-border rounded-xl pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Relationship
                </label>
                <div className="flex flex-wrap gap-2">
                  {relationships.map((rel) => (
                    <button
                      key={rel}
                      onClick={() => setRelationship(rel)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        relationship === rel 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-foreground hover:bg-accent'
                      }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddContact}
                  disabled={!name || !phone || !relationship}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        ) : emergencyContacts.length < 5 && (
          <button
            onClick={() => setShowForm(true)}
            className="glass-card p-4 flex items-center justify-center gap-2 text-primary hover:bg-accent/50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Contact</span>
          </button>
        )}

        {/* Info */}
        <div className="glass-card p-4 mt-4 mb-6">
          <p className="text-sm text-muted-foreground">
            💡 Primary contact is alerted first. Others are notified if no response within 30 seconds.
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Continue button */}
        <Button 
          onClick={() => setScreen('setup-complete')}
          disabled={!canContinue}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
