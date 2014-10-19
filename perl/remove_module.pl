#!/usr/bin/perl -w


use ExtUtils::Packlist; 
use ExtUtils::Installed; 

$ARGV[0] or die "Usage: $0 Module::Name\n"; 

my $module = $ARGV[0]; 

my $inst = ExtUtils::Installed->new(); 

foreach my $item (sort($inst->files($module))) { 
    print "Removing $item\n"; 
    unlink $item; 
} 

my $packfile = $inst->packlist($module)->packlist_file(); 
print "Removing $packfile\n"; 
unlink $packfile; 
