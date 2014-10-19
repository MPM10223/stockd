/**
 * index.js
 */
$(function() {
    var $urlInput = $('#urlInput');
    var $sizeSelect = $('#size');
    var $submitButton = $('#submit');
    var $sizesAvailable = [];
    
    $urlInput.on('input', function(ev) {
        $.ajax({
            url: "/processURL?productURL=" + encodeURIComponent($urlInput.val())
            , success: function(data) {
            
                console.log(data);
            
                if(data.success) {
                    $('#URLmessage').removeClass('alert-danger');
                    $('#URLmessage').html('');
                
                    // retailer
                    $('#retailer').text(data.retailer);
                    $('#retailerInput').val(data.retailer);
                    
                    // brand / product name
                    $('#brandProduct').text(data.brand + ' ' + data.productname);
                    $('#productName').val(data.productname);
                    
                    // image
                    $('#productImage').attr('src', data.imageURL);
                    
                    // price
                    $('#priceText').text(data.saleprice != null ? data.saleprice : data.regprice);
                    $('#price').val(data.saleprice != null ? data.saleprice : data.regprice);
                    
                    // colors
                    $('#color').html('');
                    for(var i = 0; i < data.colors.length; i++) {
                        $('#color').append('<option value="'+data.colors[i].value+'">'+data.colors[i].name+'</option>');
                    }
                    $('#color').val([]);
                    
                    // sizes
                    $('#size').html(''); // clear any existing options
                    for(var i = 0; i < data.allSizes.length; i++) {
                        $('#size').append('<option value="'+data.allSizes[i]+'">'+data.allSizes[i]+'</option>');
                    }
                    $('#size').val([]);
                    
                    $sizesAvailable = data.sizesAvailable;
                    
                    // show controls
                    $('form div.form-group').each(function(i, el) {
                        $(this).removeClass('hidden');
                    });
                    
                } else {
                    $('#URLmessage').addClass('alert-danger');
                    $('#URLmessage').html("<strong>Oops!</strong> Sorry, we can't process this URL right now. Please try again later.")
                }
            }
            , dataType: "json"
            , timeout: 5000
            , error: function (req, status, error) {
                $('#URLmessage').addClass('alert-danger');
                $('#URLmessage').html("<strong>Oops!</strong> Sorry, we can't process this URL right now. Please try again later.")
            }
        });
    });
    
    $sizeSelect.on('change', function(ev) {
        var instock = false;
        for (var i = 0; i < $sizesAvailable.length; i++) {
            if($(this).val() === $sizesAvailable[i]) {
                instock = true;
                break;
            }
        }
        
        if(instock) {            
            $('#sizeMessage').addClass('alert');
            $('#sizeMessage').addClass('alert-success');
            $('#sizeMessage').html("<strong>Great news!</strong> This size is currently available. <a href=\""+$urlInput.val()+"\">Order it now</a>");
        } else {
            $('#sizeMessage').removeClass('alert');
            $('#sizeMessage').removeClass('alert-success');
            $('#sizeMessage').html("");
        }
    });
});