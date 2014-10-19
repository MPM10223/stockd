#!/usr/local/bin/perl
use LWP::UserAgent [search.cpan.org]; 
use HTTP::Request [kobesearch.cpan.org];
use Web::Query;
use Email::Send;
use Email::Send::Gmail;
use Email::Simple::Creator;
use DateTime;
use MongoDB;
use MongoDB::OID;

my $client = MongoDB::MongoClient->new;
my $db = $client->get_database('stokd');
my $collection = $db->get_collection('sizeNotificationRequests');
my $retailers = $db->get_collection('retailers');
my $snrs = $collection->find({'sent' => { '$exists' => 0 }});

while (my $snr = $snrs->next) {

my $snrID = $snr->{'_id'};
my $URL = $snr->{'productURL'};
my $retailerID = $snr->{'retailer'};
my $retailer = $retailers->find_one({_id => $retailerID});

my $dt = DateTime->now;
print join ' ', $dt->ymd, $dt->hms;
print "\n";
print "Checking ${URL}É\n";

my $agent = LWP::UserAgent->new(env_proxy => 1,keep_alive => 1, timeout => 30, agent => "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.71 Safari/534.24"); 
my $header = HTTP::Request->new(GET => $URL); 
my $request = HTTP::Request->new('GET', $URL, $header); 
my $response = $agent->request($request);

# Check the outcome of the response 
if ($response->is_success){ 
  #print $response->as_string;
  my $w = Web::Query->new_from_html($response->as_string);
  print "\n";
  $w->find($retailer->{'queryStrings'}->{'sizes'})->each(sub {
    my $size = $_->text;
    print "Found ${size}...\n";
    if($size eq $snr->{size}) {
      print "Found size ${size}! Sending email!!!\n";
      my $productName = $snr->{'productName'};
      my $email = Email::Simple->create(
          header => [
              From    => 'mike.monteiro@gmail.com',
              To      => $snr->{'email'},
              Subject => "${productName} is now available in size ${size}!",
          ],
          body => "Check it out:\n${URL}",
      );

      #TODO: use a common email account
      my $sender = Email::Send->new(
          {   mailer      => 'Gmail',
              mailer_args => [
                  username => 'mike.monteiro@gmail.com',
                  password => 'pbmqotxpzeflgrtt',
             ]
          }
      );
      eval { $sender->send($email) };
      die "Error sending email: $@" if $@;
      
      $collection->update({"_id" => $snrID}, {'$set' => {'sent' => 1}});
    }
  });
}elsif ($response->is_error){ 
print "Error:$URL\n"; 
print $response->error_as_HTML; 
}

}